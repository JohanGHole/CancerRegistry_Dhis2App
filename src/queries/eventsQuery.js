
export const eventsQuery = {
    results: {
        resource: 'tracker/trackedEntities',
        params: ({ page, startDate, endDate, orgUnitID, pageSize, ouMode, program }) => ({
            page: page,
            orgUnits: orgUnitID,
            orgUnitMode: ouMode,
            program: program,
            fields: 'attributes[attribute,value],enrollments[trackedEntity,enrollment,events[storedBy,event,programStage,dataValues[dataElement,value]]]',
            enrollmentEnrolledAfter: startDate,
            enrollmentEnrolledBefore: endDate,
            totalPages: true,
            pageSize: pageSize,
        }),
    },
}
