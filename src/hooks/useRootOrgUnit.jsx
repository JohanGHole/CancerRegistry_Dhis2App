import { useDataQuery } from '@dhis2/app-runtime'

const rootOrgUnitQuery = {
    rootOrgUnit: {
        resource: 'organisationUnits',
        params: {
            level: 1,
            fields: ['id', 'displayName', 'children[id,name]'],
            paging: false,
        },
    },
}

export const useRootOrgUnit = () => {
    const { loading, error, data } = useDataQuery(rootOrgUnitQuery)

    const rootOrgUnit = data?.rootOrgUnit?.organisationUnits?.[0]

    return {
        loading,
        error,
        rootOrgUnitId: rootOrgUnit?.id,
        rootOrgUnitName: rootOrgUnit?.displayName,
        rootOrgUnitChildren: rootOrgUnit?.children || [],
    }
}
