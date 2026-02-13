
export const eventsQuery = {
    results: {
        resource: 'trackedEntityInstances.json',
        params: ({ page, startDate, endDate, orgUnitID, pageSize, ouMode }) => ({
            page: page,
            ou: orgUnitID,
            ouMode: ouMode,
            program: 'rx6V962E4XM',
            fields: ['attributes[attribute,value],enrollments[trackedEntityInstance,enrollment,events[storedBy,event,programStage,dataValues[dataElement,value]]]'],
            programStartDate: startDate,
            programEndDate: endDate,
            totalPages: true,
            pageSize: pageSize,
        }),
    },
}
