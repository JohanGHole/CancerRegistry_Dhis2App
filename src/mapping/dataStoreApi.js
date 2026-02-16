const NAMESPACE = 'cancerRegistryApp'
const KEY = 'fieldMapping'

export const mappingQuery = {
    mapping: {
        resource: `dataStore/${NAMESPACE}/${KEY}`,
    },
}

export const createMappingMutation = {
    type: 'create',
    resource: `dataStore/${NAMESPACE}/${KEY}`,
    data: ({ mapping }) => mapping,
}

export const updateMappingMutation = {
    type: 'update',
    resource: `dataStore/${NAMESPACE}/${KEY}`,
    data: ({ mapping }) => mapping,
}
