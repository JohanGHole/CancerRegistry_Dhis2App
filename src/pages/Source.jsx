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
    getAttrValue,
    collectStageEvents,
    extractEventData,
    formatValuesForTsv,
    downloadTsvFile,
} from '../app_utils/App_Utils'
import { useRootOrgUnitContext } from '../context/RootOrgUnitContext'
import { useMappingContext } from '../mapping/MappingContext'
import { eventsQuery } from '../queries/eventsQuery'

const REGNO_LENGTH = 8

const DERIVED_COLUMNS = [
    { name: 'SOURCERECORDID', value: ({ eventData, sourceIndex }) => {
        const tumourId = eventData?.TUMOURIDSOURCETABLE?.value || ''
        return tumourId ? `${tumourId}${String(sourceIndex).padStart(2, '0')}` : ''
    }},
]

export const Source = () => {
    const { rootOrgUnitId } = useRootOrgUnitContext()
    const { mapping } = useMappingContext()
    const [forFileDownload, setForFileDownload] = useState(false)

    const exportTSVFile = (trackedEntities) => {
        const sourceKeys = Object.keys(mapping.dataElements?.source || {})
        const sourceDefs = mapping.dataElements?.source || {}
        const derivedNames = DERIVED_COLUMNS.map((d) => d.name)
        const header = [...derivedNames, ...sourceKeys].join('\t')

        const rows = []

        for (const tei of trackedEntities) {
            const regno = getAttrValue(tei.attributes, mapping.attributes?.REGNO)
            if (!regno) continue
            if (REGNO_LENGTH > 0 && regno.length !== REGNO_LENGTH) continue

            const sourceEvents = collectStageEvents(tei.enrollments, mapping.programStages?.source)

            for (let i = 0; i < sourceEvents.length; i++) {
                const event = sourceEvents[i]
                const eventData = extractEventData(event, sourceDefs)

                const ctx = { regno, sourceIndex: i + 1, eventData }
                const derivedValues = DERIVED_COLUMNS.map((d) => d.value(ctx))
                const sourceValues = formatValuesForTsv(sourceKeys, eventData)

                rows.push([...derivedValues, ...sourceValues].join('\t'))
            }
        }

        downloadTsvFile(header, rows, 'source_data.txt')
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