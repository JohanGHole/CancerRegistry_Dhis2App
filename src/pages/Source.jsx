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
    getAttrValue,
    collectStageEvents,
    extractEventData,
    formatValuesForTsv,
} from '../app_utils/App_Utils'
import { useTrackedEntityExport } from '../hooks/useTrackedEntityExport.jsx'

const DERIVED_COLUMNS = [
    { name: 'SOURCERECORDID', value: ({ eventData, sourceIndex }) => {
        const tumourId = eventData?.TUMOURIDSOURCETABLE?.value || ''
        return tumourId ? `${tumourId}${String(sourceIndex).padStart(2, '0')}` : ''
    }},
]

const buildHeader = (mapping) => {
    const sourceKeys = Object.keys(mapping.dataElements?.source || {})
    const derivedNames = DERIVED_COLUMNS.map((d) => d.name)
    return [...derivedNames, ...sourceKeys].join('\t')
}

const buildRowsForTei = ({ tei, regno, mapping }) => {
    const sourceKeys = Object.keys(mapping.dataElements?.source || {})
    const sourceDefs = mapping.dataElements?.source || {}
    const sourceEvents = collectStageEvents(tei.enrollments, mapping.programStages?.source)

    const rows = []
    for (let i = 0; i < sourceEvents.length; i++) {
        const event = sourceEvents[i]
        const eventData = extractEventData(event, sourceDefs)

        const ctx = { regno, sourceIndex: i + 1, eventData }
        const derivedValues = DERIVED_COLUMNS.map((d) => d.value(ctx))
        const sourceValues = formatValuesForTsv(sourceKeys, eventData)

        rows.push([...derivedValues, ...sourceValues].join('\t'))
    }
    return rows
}

export const Source = () => {
    const {
        loading, error, data, refetch, mapping, triggerDownload, updateFetchInfo,
    } = useTrackedEntityExport({
        filename: 'source_data.txt',
        buildHeader,
        buildRowsForTei,
    })

    if (error) return <ConfigurationErrorNotice error={error} />
    if (loading) return <CircularLoader />

    return (
        <div className={classes.tableContainer}>
            <div className="products">
                <AllRecordsHeaderView onUpdateFetchInfo={updateFetchInfo} />

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
                                            {i18n.t('Download Source Data')}
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
