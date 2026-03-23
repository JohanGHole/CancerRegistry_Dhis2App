
export const eventsQuery = {
    results: {
        resource: 'tracker/trackedEntities',
        params: ({ page, startDate, endDate, orgUnitID, pageSize, ouMode, program }) => ({
            page: page,
            orgUnits: orgUnitID,
            orgUnitMode: ouMode,
            program: program,
            fields: 'updatedBy[username],attributes[attribute,value,valueType],enrollments[trackedEntity,enrollment,events[updatedBy[username],event,programStage,dataValues[dataElement,value,valueType]]]',
            enrollmentEnrolledAfter: startDate,
            enrollmentEnrolledBefore: endDate,
            totalPages: true,
            pageSize: pageSize,
        }),
    },
}
