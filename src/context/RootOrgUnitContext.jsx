import React, { createContext, useContext } from 'react'
import { useDataQuery } from '@dhis2/app-runtime'
import { CircularLoader } from '@dhis2/ui'

const RootOrgUnitContext = createContext(null)

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

export const RootOrgUnitProvider = ({ children }) => {
    const { loading, error, data } = useDataQuery(rootOrgUnitQuery)

    if (loading) {
        return <CircularLoader />
    }

    if (error) {
        return <span>Failed to load organisation unit: {error.message}</span>
    }

    const rootOrgUnit = data.rootOrgUnit.organisationUnits[0]

    const value = {
        rootOrgUnitId: rootOrgUnit.id,
        rootOrgUnitName: rootOrgUnit.displayName,
        rootOrgUnitChildren: rootOrgUnit.children || [],
    }

    return (
        <RootOrgUnitContext.Provider value={value}>
            {children}
        </RootOrgUnitContext.Provider>
    )
}

export const useRootOrgUnitContext = () => {
    const context = useContext(RootOrgUnitContext)
    if (!context) {
        throw new Error('useRootOrgUnitContext must be used within a RootOrgUnitProvider')
    }
    return context
}
