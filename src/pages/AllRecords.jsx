import { useDataQuery } from '@dhis2/app-runtime'
import {
    Button, CircularLoader, Table, TableBody, TableCell,
    TableCellHead, TableHead, TableRow, TableRowHead,
} from '@dhis2/ui'
import React, { useState } from 'react'

import { AllRecordsHeaderView } from './AllRecordsHeaderView.jsx'
import { PaginationControls } from './SourceComponents/PaginationControls.jsx'
import * as classes from '../App.module.css'
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
    downloadTsvFile,
    TOPOGRAPHY_KEYS,
} from '../app_utils/App_Utils'
import { useRootOrgUnitContext } from '../context/RootOrgUnitContext'
import { useMappingContext } from '../mapping/MappingContext'
import { eventsQuery } from '../queries/eventsQuery'


const REGNO_LENGTH = 8

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

export const AllRecords = () => {
    const { rootOrgUnitId } = useRootOrgUnitContext()
    const { mapping } = useMappingContext()
    const [forFileDownload, setForFileDownload] = useState(false)

    const exportTSVFile = (trackedEntities) => {
        const sourceKeys   = Object.keys(mapping.dataElements?.source || {})
        const tumourKeys   = Object.keys(mapping.dataElements?.tumour || {})
        const attrKeys     = Object.keys(mapping.attributes || {})
        const followUpKeys = Object.keys(mapping.dataElements?.followUp || {})

        const header = [
            ...SOURCE_DERIVED.map((d) => d.name),
            ...sourceKeys,
            ...tumourKeys,
            ...TUMOUR_DERIVED.map((d) => d.name),
            ...attrKeys,
            ...followUpKeys,
            ...PATIENT_DERIVED.map((d) => d.name),
        ].join('\t')

        const sourceDefs = mapping.dataElements?.source || {}
        const tumourDefs = mapping.dataElements?.tumour || {}
        const rows = []

        for (const tei of trackedEntities) {
            const regno = getAttrValue(tei.attributes, mapping.attributes?.REGNO)
            if (!regno) continue
            if (REGNO_LENGTH > 0 && regno.length !== REGNO_LENGTH) continue

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
        }

        downloadTsvFile(header, rows, 'all_records.txt')
        setForFileDownload(false)
        refetch({ pageSize: 5 })
    }

    const { loading, error, data, refetch } = useDataQuery(eventsQuery, {
        variables: {
            page: 1,
            startDate: '2018-01-01',
            endDate: new Date().toISOString().slice(0, 10),
            orgUnitID: rootOrgUnitId,
            pageSize: 5,
            ouMode: 'SELECTED',
            program: mapping.program,
        },
    })

    if (error) return <span>ERROR: {error.message}</span>
    if (loading) return <CircularLoader />

    if (data?.results?.trackedEntities && forFileDownload) {
        exportTSVFile(data.results.trackedEntities)
    }

    const updateDownloadInfo = (pageSize) => {
        setForFileDownload(true)
        refetch({ pageSize })
    }

    const updateFetchInfo = (startDate, endDate, orgUnitID, ouMode) => {
        refetch({ startDate, endDate, orgUnitID, ouMode })
        setForFileDownload(false)
    }

    return (
        <div className={classes.tableContainer}>
            <div className="products">
                <AllRecordsHeaderView
                    onUpdateFetchInfo={updateFetchInfo}
                />

                {/* Download button */}
                <Table>
                    <TableHead>
                        <TableRowHead>
                            <TableCellHead className={styles.leftcell}>
                                <div className={styles.row}>
                                    <div className={styles.downloadfiles}>
                                        <Button
                                            primary
                                            onClick={() =>
                                                updateDownloadInfo(
                                                    data.results.pager.total
                                                )
                                            }
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