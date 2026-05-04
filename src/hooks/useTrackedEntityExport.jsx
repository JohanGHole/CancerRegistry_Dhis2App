import { useDataQuery, useAlert } from '@dhis2/app-runtime'
import { useEffect, useState } from 'react'

import { downloadTsvFile, getAttrValue } from '../app_utils/App_Utils'
import { useRootOrgUnitContext } from '../context/RootOrgUnitContext'
import i18n from '../locales/index.js'
import { useMappingContext } from '../mapping/MappingContext'
import { eventsQuery } from '../queries/eventsQuery'

export const REGNO_MIN_LENGTH = 8

const DEFAULT_PAGE_SIZE = 5

export const useTrackedEntityExport = ({
    filename,
    buildHeader,
    buildRowsForTei,
}) => {
    const { rootOrgUnitId } = useRootOrgUnitContext()
    const { mapping } = useMappingContext()
    const [forFileDownload, setForFileDownload] = useState(false)

    const { show } = useAlert(
        ({ message }) => message,
        ({ status }) => {
            if (status === 'success') return { success: true }
            if (status === 'error') return { critical: true }
            if (status === 'warning') return { warning: true }
            return {}
        }
    )

    const { loading, error, data, refetch } = useDataQuery(eventsQuery, {
        variables: {
            page: 1,
            startDate: '2018-01-01',
            endDate: new Date().toISOString().slice(0, 10),
            orgUnitID: rootOrgUnitId,
            pageSize: DEFAULT_PAGE_SIZE,
            ouMode: 'SELECTED',
            program: mapping.program,
        },
    })

    const runExport = (trackedEntities) => {
        const header = buildHeader(mapping)

        const rows = []
        let skippedMissingRegno = 0
        let skippedShortRegno = 0

        for (const tei of trackedEntities) {
            const regno = getAttrValue(tei.attributes, mapping.attributes?.REGNO)
            if (!regno) {
                skippedMissingRegno++
                continue
            }
            if (REGNO_MIN_LENGTH > 0 && regno.length < REGNO_MIN_LENGTH) {
                skippedShortRegno++
                continue
            }
            const teiRows = buildRowsForTei({ tei, regno, mapping })
            for (const row of teiRows) rows.push(row)
        }

        downloadTsvFile(header, rows, filename)

        const skippedTotal = skippedMissingRegno + skippedShortRegno
        if (rows.length === 0) {
            show({
                message: i18n.t(
                    'Downloaded file is empty: skipped {{total}} record(s) ({{missing}} missing REGNO, {{short}} REGNO shorter than {{min}} characters). Check your dataStore mapping for REGNO.',
                    {
                        total: skippedTotal,
                        missing: skippedMissingRegno,
                        short: skippedShortRegno,
                        min: REGNO_MIN_LENGTH,
                    }
                ),
                status: 'error',
            })
        } else if (skippedTotal > 0) {
            show({
                message: i18n.t(
                    'Exported {{rows}} record(s); skipped {{total}} ({{missing}} missing REGNO, {{short}} REGNO shorter than {{min}} characters).',
                    {
                        rows: rows.length,
                        total: skippedTotal,
                        missing: skippedMissingRegno,
                        short: skippedShortRegno,
                        min: REGNO_MIN_LENGTH,
                    }
                ),
                status: 'warning',
            })
        }

        setForFileDownload(false)
        refetch({ pageSize: DEFAULT_PAGE_SIZE })
    }

    useEffect(() => {
        if (forFileDownload && !loading && data?.results?.trackedEntities) {
            runExport(data.results.trackedEntities)
        }
    }, [forFileDownload, loading, data])

    const triggerDownload = (pageSize) => {
        setForFileDownload(true)
        refetch({ page: 1, pageSize })
    }

    const updateFetchInfo = (startDate, endDate, orgUnitID, ouMode) => {
        refetch({ page: 1, startDate, endDate, orgUnitID, ouMode })
        setForFileDownload(false)
    }

    return {
        loading,
        error,
        data,
        refetch,
        mapping,
        triggerDownload,
        updateFetchInfo,
    }
}
