import { useDataQuery } from '@dhis2/app-runtime'
import {
    Button, CircularLoader, Table, TableBody, TableCell,
    TableCellHead, TableHead, TableRow, TableRowHead,
} from '@dhis2/ui'
import React, { useState } from 'react'

import { AllRecordsHeaderView } from './AllRecordsHeaderView.jsx'
import { PaginationControls } from './TumourComponents/PaginationControls.jsx'
import * as classes from '../App.module.css'
import i18n from '../locales/index.js'
import styles from './Form.module.css'

import {
    getAttrValue,
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

const DERIVED_COLUMNS = [
    { name: 'TUMOURUPDATEDBY', value: ({ updatedBy }) => updatedBy },
]

export const Tumour = () => {
    const { rootOrgUnitId } = useRootOrgUnitContext()
    const { mapping } = useMappingContext()
    const [forFileDownload, setForFileDownload] = useState(false)

    const exportTSVFile = (trackedEntities) => {
        const tumourKeys = Object.keys(mapping.dataElements?.tumour || {})
        const tumourDefs = mapping.dataElements?.tumour || {}
        const derivedNames = DERIVED_COLUMNS.map((d) => d.name)
        const header = [...tumourKeys, ...derivedNames].join('\t')

        const rows = []

        for (const tei of trackedEntities) {
            const regno = getAttrValue(tei.attributes, mapping.attributes?.REGNO)
            if (!regno) continue
            if (REGNO_LENGTH > 0 && regno.length !== REGNO_LENGTH) continue

            const tumourEvents = collectStageEvents(tei.enrollments, mapping.programStages?.tumour)

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
        }

        downloadTsvFile(header, rows, 'tumour_data.txt')
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
