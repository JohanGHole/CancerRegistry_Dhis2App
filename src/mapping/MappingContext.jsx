import React, { createContext, useContext, useEffect, useRef } from 'react'
import { useDataQuery, useDataMutation } from '@dhis2/app-runtime'
import { CircularLoader } from '@dhis2/ui'

import { mappingQuery, createMappingMutation } from './dataStoreApi'
import { DEFAULT_MAPPING } from './defaultMapping'

const MappingContext = createContext(null)

export const MappingProvider = ({ children }) => {
    const { loading, error, data } = useDataQuery(mappingQuery)
    const [seedMapping] = useDataMutation(createMappingMutation)
    const seeded = useRef(false)
    const is404 = error?.details?.httpStatusCode === 404

    // Seed the DataStore once if the key does not exist yet.
    useEffect(() => {
        if (is404 && !seeded.current) {
            seeded.current = true
            seedMapping({ mapping: DEFAULT_MAPPING })
        }
    }, [is404, seedMapping])

    if (loading) {
        return <CircularLoader />
    }
    if (error && !is404) {
        return <span>Failed to load field mapping: {error.message}</span>
    }

    const mapping = is404 || !data?.mapping ? DEFAULT_MAPPING : data.mapping

    return (
        <MappingContext.Provider value={{ mapping }}>
            {children}
        </MappingContext.Provider>
    )
}

export const useMappingContext = () => {
    const context = useContext(MappingContext)
    if (!context) {
        throw new Error(
            'useMappingContext must be used within a MappingProvider'
        )
    }
    return context
}
