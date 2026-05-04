import {
    Button, CircularLoader, Table, TableBody, TableCell,
    TableCellHead, TableHead, TableRow, TableRowHead,
} from '@dhis2/ui'
import React from 'react'

import { AllRecordsHeaderView } from './AllRecordsHeaderView.jsx'
import { PaginationControls } from './TumourComponents/PaginationControls.jsx'
import * as classes from '../App.module.css'
import { ConfigurationErrorNotice } from '../components/ConfigurationErrorNotice'
import i18n from '../locales/index.js'
import styles from './Form.module.css'

import {
    getAttrValue,
    collectStageEvents,
    extractEventData,
    formatValuesForTsv,
    TOPOGRAPHY_KEYS,
} from '../app_utils/App_Utils'
import { useTrackedEntityExport } from '../hooks/useTrackedEntityExport.jsx'

const DERIVED_COLUMNS = [
    { name: 'TUMOURUPDATEDBY', value: ({ updatedBy }) => updatedBy },
]

const buildHeader = (mapping) => {
    const tumourKeys = Object.keys(mapping.dataElements?.tumour || {})
    const derivedNames = DERIVED_COLUMNS.map((d) => d.name)
    return [...tumourKeys, ...derivedNames].join('\t')
}

const buildRowsForTei = ({ tei, regno, mapping }) => {
    const tumourKeys = Object.keys(mapping.dataElements?.tumour || {})
    const tumourDefs = mapping.dataElements?.tumour || {}
    const tumourEvents = collectStageEvents(tei.enrollments, mapping.programStages?.tumour)

    const rows = []
    for (let i = 0; i < tumourEvents.length; i++) {
        const event = tumourEvents[i]
        const eventData = extractEventData(event, tumourDefs)
        const tumourValues = formatValuesForTsv(tumourKeys, eventData, TOPOGRAPHY_KEYS)

        const ctx = {
            regno,
            tumourIndex: i + 1,
            tumourTotal: tumourEvents.length,
            updatedBy: event.updatedBy?.username || '',
        }
        const derivedValues = DERIVED_COLUMNS.map((d) => d.value(ctx))

        rows.push([...tumourValues, ...derivedValues].join('\t'))
    }
    return rows
}

export const Tumour = () => {
    const {
        loading, error, data, refetch, mapping, triggerDownload, updateFetchInfo,
    } = useTrackedEntityExport({
        filename: 'tumour_data.txt',
        buildHeader,
        buildRowsForTei,
    })

    if (error) return <ConfigurationErrorNotice error={error} />
    if (loading) return <CircularLoader />

    const tumourKeys = Object.keys(mapping.dataElements?.tumour || {})
    const previewKeys = tumourKeys.slice(0, 5)
    const getEventValue = (event, key) => {
        const uid = mapping.dataElements?.tumour?.[key]
        if (!uid) return ''
        const dv = (event.dataValues || []).find((d) => d.dataElement === uid)
        return dv?.value || ''
    }

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
                                            {i18n.t('Download Tumour Data')}
                                        </Button>
                                    </div>
                                </div>
                            </TableCellHead>
                        </TableRowHead>
                    </TableHead>
                </Table>

                <Table>
                    <TableHead>
                        <TableRowHead>
                            <TableCellHead>{i18n.t('REGNO')}</TableCellHead>
                            {previewKeys.map((key) => (
                                <TableCellHead key={key}>{i18n.t(key)}</TableCellHead>
                            ))}
                        </TableRowHead>
                    </TableHead>
                    <TableBody>
                        {(data?.results?.trackedEntities || []).flatMap((tei) =>
                            (tei.enrollments || []).flatMap((enrollment) =>
                                (enrollment.events || [])
                                    .filter((ev) => ev.programStage === mapping.programStages?.tumour)
                                    .map((event) => (
                                        <TableRow key={event.event}>
                                            <TableCell>
                                                {getAttrValue(tei.attributes, mapping.attributes?.REGNO)}
                                            </TableCell>
                                            {previewKeys.map((key) => (
                                                <TableCell key={key}>
                                                    {getEventValue(event, key)}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                            )
                        )}
                    </TableBody>
                </Table>
            </div>
            <PaginationControls pager={data.results.pager} refetch={refetch} />
        </div>
    )
}
