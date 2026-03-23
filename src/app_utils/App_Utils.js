export const formatTodayDate = () => {
    let todayDate = new Date().toISOString().slice(0, 10)
    todayDate = todayDate.replace(/#|-/g,'').toString()
    return todayDate
}

export const formatCanRegDate = (dateStr) => {
    if (!dateStr || dateStr.length < 10) return ''
    return dateStr.substring(0, 4) + dateStr.substring(5, 7) + dateStr.substring(8, 10)
}


export const isDateValueType = (valueType) => {
    if (!valueType) return false
    const vt = valueType.toUpperCase()
    return vt === 'DATE' || vt === 'DATETIME' || vt === 'AGE'
}

export const shouldFormatAsDate = (valueType, value) => {
    if (isDateValueType(valueType)) return true
    if (!valueType && value && /^\d{4}-\d{2}-\d{2}/.test(value)) return true
    return false
}

export const getAttr = (attributes, uid) => {
    if (!uid) return { value: '', valueType: '' }
    const found = (attributes || []).find((a) => a.attribute === uid)
    return found
        ? { value: found.value || '', valueType: found.valueType || '' }
        : { value: '', valueType: '' }
}

export const getAttrValue = (attributes, uid) => getAttr(attributes, uid).value

// The topogrophy keys need to be zero-padded to 3 digits for CanReg5 import. In DHIS2, this is just a number and used in program-rules
export const padTopography = (value) => {
    if (!value && value !== 0) return ''
    return String(value).padStart(3, '0')
}


export const TOPOGRAPHY_KEYS = new Set(['TOP'])

export const collectStageEvents = (enrollments, programStageId) => {
    const events = []
    for (const enrollment of (enrollments || [])) {
        for (const event of (enrollment.events || [])) {
            if (event.programStage === programStageId) {
                events.push(event)
            }
        }
    }
    return events
}

export const extractEventData = (event, defsMap) => {
    const uidToKey = {}
    for (const [key, uid] of Object.entries(defsMap || {})) {
        uidToKey[uid] = key
    }
    const data = {}
    for (const dv of (event?.dataValues || [])) {
        const key = uidToKey[dv.dataElement]
        if (key) {
            data[key] = { value: dv.value || '', valueType: dv.valueType || '' }
        }
    }
    return data
}

export const formatValuesForTsv = (keys, eventData, topoKeys = TOPOGRAPHY_KEYS) => {
    return keys.map((key) => {
        const { value, valueType } = eventData[key] || {}
        if (topoKeys.has(key)) return padTopography(value || '')
        if (shouldFormatAsDate(valueType, value || '')) return formatCanRegDate(value || '')
        return value || ''
    })
}

export const downloadTsvFile = (header, rows, filename) => {
    const content = [header, ...rows].join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

export const extractFollowUpData = (enrollments, mapping) => {
    const followUpDefs = mapping.dataElements?.followUp || {}
    const uidToKey = {}
    for (const [key, uid] of Object.entries(followUpDefs)) {
        uidToKey[uid] = key
    }

    let bestDLC = ''
    let bestData = {}
    let bestStoredBy = ''

    for (const enrollment of (enrollments || [])) {
        for (const event of (enrollment.events || [])) {
            if (event.programStage !== mapping.programStages?.followUp) continue

            const eventData = {}
            for (const dv of (event.dataValues || [])) {
                const key = uidToKey[dv.dataElement]
                if (key) {
                    eventData[key] = {
                        value: dv.value || '',
                        valueType: dv.valueType || '',
                    }
                }
            }

            const dlc = eventData.DLC?.value || ''
            if (!bestDLC || dlc > bestDLC) {
                bestDLC = dlc
                bestData = eventData
                bestStoredBy = event.updatedBy?.username || ''
            }
        }
    }

    const result = {}
    for (const key of Object.keys(followUpDefs)) {
        result[key] = bestData[key] || { value: '', valueType: '' }
    }
    return { followUpValues: result, storedBy: bestStoredBy }
}
