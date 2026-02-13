import { useEffect, useState } from 'react'
import { useDataQuery } from '@dhis2/app-runtime'
import { useRootOrgUnit } from './useRootOrgUnit'
import { eventsQuery } from '../queries/eventsQuery'


export const useEventsData = (options = {}) => {
    const {
        startDate = '2021-02-01',
        endDate = '2021-06-01',
        pageSize = 5,
    } = options

    const { 
        rootOrgUnitId, 
        rootOrgUnitChildren: provinces, 
        loading: rootLoading,
        error: rootError 
    } = useRootOrgUnit()

    const [initialFetchDone, setInitialFetchDone] = useState(false)

    const { loading, error, data, refetch } = useDataQuery(eventsQuery, {
        variables: { 
            page: 0, 
            startDate, 
            endDate, 
            orgUnitID: rootOrgUnitId || '', 
            pageSize, 
            ouMode: 'DESCENDANTS' 
        },
        lazy: true,
    })

    useEffect(() => {
        if (rootOrgUnitId && !initialFetchDone) {
            setInitialFetchDone(true)
            refetch({ 
                page: 0, 
                startDate, 
                endDate, 
                orgUnitID: rootOrgUnitId, 
                pageSize, 
                ouMode: 'DESCENDANTS' 
            })
        }
    }, [rootOrgUnitId, initialFetchDone, refetch, startDate, endDate, pageSize])

    return {
        loading: rootLoading || (!initialFetchDone) || loading,
        error: error || rootError,
        data,
        refetch,
        provinces,
        rootOrgUnitId,
    }
}
