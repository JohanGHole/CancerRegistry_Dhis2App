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
    formatCanRegDate,
    shouldFormatAsDate,
    getAttr,
    getAttrValue,
    extractFollowUpData,
    downloadTsvFile,
} from '../app_utils/App_Utils'
import { useRootOrgUnitContext } from '../context/RootOrgUnitContext'
import { useMappingContext } from '../mapping/MappingContext'
import { eventsQuery } from '../queries/eventsQuery'
const REGNO_LENGTH = 8

const DERIVED_COLUMNS = [
    { name: 'PATIENTRECORDID',      value: ({ regno }) => regno ? `${regno}01` : '' },
    { name: 'PATIENTUPDATEDBY',     value: ({ storedBy })  => storedBy },
]

export const Patient = () => {
    const { rootOrgUnitId } = useRootOrgUnitContext()
    const { mapping } = useMappingContext()
    const [forFileDownload, setForFileDownload] = useState(false)

    const exportTSVFile = (trackedEntities) => {

        const attrKeys = Object.keys(mapping.attributes || {})
        const followUpKeys = Object.keys(mapping.dataElements?.followUp || {})
        const derivedNames = DERIVED_COLUMNS.map((d) => d.name)

        const header = [...attrKeys, ...followUpKeys, ...derivedNames].join('\t')

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
                return shouldFormatAsDate(valueType, value || '') ? formatCanRegDate(value || '') : (value || '')
            })

            const patientUpdatedBy = followUpStoredBy || tei.updatedBy?.username || ''
            const ctx = { regno, storedBy: patientUpdatedBy }
            const derivedValues = DERIVED_COLUMNS.map((d) => d.value(ctx))

            rows.push([...attrValues, ...fuValues, ...derivedValues].join('\t'))
        }

        downloadTsvFile(header, rows, 'patient_data.txt')
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
                                            {i18n.t('Download Patient Data')}
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