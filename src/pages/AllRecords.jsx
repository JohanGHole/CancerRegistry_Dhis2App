import {
    Button, CircularLoader, Table, TableBody, TableCell,
    TableCellHead, TableHead, TableRow, TableRowHead,
} from '@dhis2/ui'
import React from 'react'

import { AllRecordsHeaderView } from './AllRecordsHeaderView.jsx'
import { PaginationControls } from './SourceComponents/PaginationControls.jsx'
import * as classes from '../App.module.css'
import { ConfigurationErrorNotice } from '../components/ConfigurationErrorNotice'
import i18n from '../locales/index.js'
import styles from './Form.module.css'

import {
    formatCanRegDate,
    shouldFormatAsDate,
    getAttr,
    getAttrValue,
    extractFollowUpData,
    collectStageEvents,
    extractEventData,
    formatValuesForTsv,
    TOPOGRAPHY_KEYS,
} from '../app_utils/App_Utils'
import { useTrackedEntityExport } from '../hooks/useTrackedEntityExport.jsx'

const SOURCE_DERIVED = [
    { name: 'SOURCERECORDID', value: ({ eventData, sourceIndex }) => {
        const tumourId = eventData?.TUMOURIDSOURCETABLE?.value || ''
        return tumourId ? `${tumourId}${String(sourceIndex).padStart(2, '0')}` : ''
    }},
]

const TUMOUR_DERIVED = [
    { name: 'TUMOURUPDATEDBY', value: ({ updatedBy }) => updatedBy },
]

const PATIENT_DERIVED = [
    { name: 'PATIENTRECORDID',  value: ({ regno }) => regno ? `${regno}01` : '' },
    { name: 'PATIENTUPDATEDBY', value: ({ storedBy }) => storedBy },
]

const buildHeader = (mapping) => {
    const sourceKeys   = Object.keys(mapping.dataElements?.source || {})
    const tumourKeys   = Object.keys(mapping.dataElements?.tumour || {})
    const attrKeys     = Object.keys(mapping.attributes || {})
    const followUpKeys = Object.keys(mapping.dataElements?.followUp || {})

    return [
        ...SOURCE_DERIVED.map((d) => d.name),
        ...sourceKeys,
        ...tumourKeys,
        ...TUMOUR_DERIVED.map((d) => d.name),
        ...attrKeys,
        ...followUpKeys,
        ...PATIENT_DERIVED.map((d) => d.name),
    ].join('\t')
}

const buildRowsForTei = ({ tei, regno, mapping }) => {
    const sourceKeys   = Object.keys(mapping.dataElements?.source || {})
    const tumourKeys   = Object.keys(mapping.dataElements?.tumour || {})
    const attrKeys     = Object.keys(mapping.attributes || {})
    const followUpKeys = Object.keys(mapping.dataElements?.followUp || {})
    const sourceDefs = mapping.dataElements?.source || {}
    const tumourDefs = mapping.dataElements?.tumour || {}

    const attrValues = attrKeys.map((key) => {
        const { value, valueType } = getAttr(tei.attributes, mapping.attributes[key])
        return shouldFormatAsDate(valueType, value) ? formatCanRegDate(value) : value
    })

    const { followUpValues, storedBy: followUpStoredBy } = extractFollowUpData(
        tei.enrollments, mapping
    )
    const fuValues = followUpKeys.map((key) => {
        const { value, valueType } = followUpValues[key] || {}
        return shouldFormatAsDate(valueType, value || '')
            ? formatCanRegDate(value || '')
            : (value || '')
    })

    const patientUpdatedBy = followUpStoredBy || tei.updatedBy?.username || ''
    const patientDerived = PATIENT_DERIVED.map((d) =>
        d.value({ storedBy: patientUpdatedBy, regno })
    )

    const tumourEvents = collectStageEvents(tei.enrollments, mapping.programStages?.tumour)
    const tumourEntries = []
    const tumourById = new Map()

    for (const ev of tumourEvents) {
        const data    = extractEventData(ev, tumourDefs)
        const values  = formatValuesForTsv(tumourKeys, data, TOPOGRAPHY_KEYS)
        const derived = TUMOUR_DERIVED.map((d) =>
            d.value({ updatedBy: ev.updatedBy?.username || '' })
        )
        const entry = { values, derived, matched: false }
        tumourEntries.push(entry)

        const tumourId = data.TUMOURID?.value || ''
        if (tumourId) tumourById.set(tumourId, entry)
    }

    // Source events, this is matched to tumour via TUMOURIDSOURCETABLE
    const sourceEvents = collectStageEvents(tei.enrollments, mapping.programStages?.source)
    const rows = []

    for (let si = 0; si < sourceEvents.length; si++) {
        const srcData   = extractEventData(sourceEvents[si], sourceDefs)
        const srcValues = formatValuesForTsv(sourceKeys, srcData)
        const srcDerived = SOURCE_DERIVED.map((d) =>
            d.value({ eventData: srcData, sourceIndex: si + 1 })
        )
        const linkedId  = srcData.TUMOURIDSOURCETABLE?.value || ''
        const tumour    = linkedId ? tumourById.get(linkedId) : null

        if (tumour) {
            tumour.matched = true
            rows.push([
                ...srcDerived,
                ...srcValues,
                ...tumour.values,
                ...tumour.derived,
                ...attrValues,
                ...fuValues,
                ...patientDerived,
            ].join('\t'))
        } else {
            const emptyTumour  = tumourKeys.map(() => '')
            const emptyDerived = TUMOUR_DERIVED.map(() => '')
            rows.push([
                ...srcDerived,
                ...srcValues,
                ...emptyTumour,
                ...emptyDerived,
                ...attrValues,
                ...fuValues,
                ...patientDerived,
            ].join('\t'))
        }
    }
    for (const entry of tumourEntries) {
        if (!entry.matched) {
            const emptySrcDerived = SOURCE_DERIVED.map(() => '')
            const emptySrc = sourceKeys.map(() => '')
            rows.push([
                ...emptySrcDerived,
                ...emptySrc,
                ...entry.values,
                ...entry.derived,
                ...attrValues,
                ...fuValues,
                ...patientDerived,
            ].join('\t'))
        }
    }
    return rows
}

export const AllRecords = () => {
    const {
        loading, error, data, refetch, mapping, triggerDownload, updateFetchInfo,
    } = useTrackedEntityExport({
        filename: 'all_records.txt',
        buildHeader,
        buildRowsForTei,
    })

    if (error) return <ConfigurationErrorNotice error={error} />
    if (loading) return <CircularLoader />

    return (
        <div className={classes.tableContainer}>
            <div className="products">
                <AllRecordsHeaderView onUpdateFetchInfo={updateFetchInfo} />

                {/* Download button */}
                <Table>
                    <TableHead>
                        <TableRowHead>
                            <TableCellHead className={styles.leftcell}>
                                <div className={styles.row}>
                                    <div className={styles.downloadfiles}>
                                        <Button
                                            primary
                                            onClick={() => triggerDownload(data.results.pager.total)}
                                        >
                                            {i18n.t('Download Oncology Data')}
                                        </Button>
                                    </div>
                                </div>
                            </TableCellHead>
                        </TableRowHead>
                    </TableHead>
                </Table>

                {/* TEI list */}
                <Table>
                    <TableHead>
                        <TableRowHead>
                            <TableCellHead>{i18n.t('REGNO')}</TableCellHead>
                            <TableCellHead>{i18n.t('First Name')}</TableCellHead>
                            <TableCellHead>{i18n.t('Last Name')}</TableCellHead>
                            <TableCellHead>{i18n.t('Date of Birth')}</TableCellHead>
                        </TableRowHead>
                    </TableHead>
                    <TableBody>
                        {(data?.results?.trackedEntities || []).map((tei, idx) => (
                            <TableRow key={idx}>
                                <TableCell>
                                    {getAttrValue(tei.attributes, mapping.attributes?.REGNO)}
                                </TableCell>
                                <TableCell>
                                    {getAttrValue(tei.attributes, mapping.attributes?.FIRSTN)}
                                </TableCell>
                                <TableCell>
                                    {getAttrValue(tei.attributes, mapping.attributes?.SURNAME)}
                                </TableCell>
                                <TableCell>
                                    {getAttrValue(tei.attributes, mapping.attributes?.BIRTHD)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <PaginationControls pager={data.results.pager} refetch={refetch} />
        </div>
    )
}
