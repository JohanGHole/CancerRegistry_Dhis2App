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
    formatCanRegDate,
    shouldFormatAsDate,
    getAttr,
    getAttrValue,
    extractFollowUpData,
} from '../app_utils/App_Utils'
import { useTrackedEntityExport } from '../hooks/useTrackedEntityExport.jsx'

const DERIVED_COLUMNS = [
    { name: 'PATIENTRECORDID',  value: ({ regno }) => regno ? `${regno}01` : '' },
    { name: 'PATIENTUPDATEDBY', value: ({ storedBy }) => storedBy },
]

const buildHeader = (mapping) => {
    const attrKeys = Object.keys(mapping.attributes || {})
    const followUpKeys = Object.keys(mapping.dataElements?.followUp || {})
    const derivedNames = DERIVED_COLUMNS.map((d) => d.name)
    return [...attrKeys, ...followUpKeys, ...derivedNames].join('\t')
}

const buildRowsForTei = ({ tei, regno, mapping }) => {
    const attrKeys = Object.keys(mapping.attributes || {})
    const followUpKeys = Object.keys(mapping.dataElements?.followUp || {})

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
    const ctx = { regno, storedBy: patientUpdatedBy }
    const derivedValues = DERIVED_COLUMNS.map((d) => d.value(ctx))

    return [[...attrValues, ...fuValues, ...derivedValues].join('\t')]
}

export const Patient = () => {
    const {
        loading, error, data, refetch, mapping, triggerDownload, updateFetchInfo,
    } = useTrackedEntityExport({
        filename: 'patient_data.txt',
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
