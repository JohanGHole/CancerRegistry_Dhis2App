import { Button, InputField, OrganisationUnitTree, Layer, Popper, Card, Chip } from "@dhis2/ui";

import { useAlert } from '@dhis2/app-runtime'
import React, { useState, useRef } from "react";
import i18n from "../locales/index.js";
import { useRootOrgUnitContext } from '../context/RootOrgUnitContext'

export const AllRecordsHeaderView = ({onUpdateFetchInfo}) => {

  const { rootOrgUnitId } = useRootOrgUnitContext()

  const [selectedOrgUnits, setSelectedOrgUnits] = useState(new Map())
  const [selectedPaths, setSelectedPaths] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [treeOpen, setTreeOpen] = useState(false)
  const anchorRef = useRef(null)

  const { show } = useAlert(
    ({ message }) => message,
    ({ status }) => {
        if (status === 'success') return { success: true }
        else if (status === 'error') return { critical: true }
        else return {}
    }
  )

  const handleOrgUnitChange = ({ id, path, displayName, checked }) => {
    setSelectedOrgUnits((prev) => {
      const next = new Map(prev)
      if (checked) {
        next.set(path, { id, displayName })
      } else {
        next.delete(path)
      }
      return next
    })
    setSelectedPaths((prev) =>
      checked ? [...prev, path] : prev.filter((p) => p !== path)
    )
  }

  const removeOrgUnit = (path) => {
    setSelectedOrgUnits((prev) => {
      const next = new Map(prev)
      next.delete(path)
      return next
    })
    setSelectedPaths((prev) => prev.filter((p) => p !== path))
  }

  const handleFetchData = () => {
    if (selectedOrgUnits.size === 0) {
      show({ message: i18n.t('Please select at least one organisation unit'), status: 'error' })
    } else if (!startDate || !endDate) {
      show({ message: i18n.t('Make sure you select Start Date and End Date'), status: 'error' })
    } else {
      const orgUnitIds = [...selectedOrgUnits.values()].map((ou) => ou.id).join(',')
      onUpdateFetchInfo(startDate, endDate, orgUnitIds, 'DESCENDANTS')
    }
  }

  const buttonLabel = selectedOrgUnits.size === 0
    ? i18n.t('Select...')
    : i18n.t('{{count}} selected', { count: selectedOrgUnits.size })

  return (
    <div style={{ padding: '16px 0 8px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 500, color: '#212934' }}>
          {i18n.t('Data for Export')}
        </h2>

        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '12px',
          flexWrap: 'wrap',
          padding: '12px 16px',
          background: '#f8f9fa',
          borderRadius: '4px',
          border: '1px solid #e8edf2',
        }}>

          <div style={{ flex: '0 0 170px' }}>
            <InputField
              label={i18n.t("Start Date")}
              type="date"
              required
              dense
              value={startDate}
              onChange={({ value }) => setStartDate(value)}
            />
          </div>

          <div style={{ flex: '0 0 170px' }}>
            <InputField
              label={i18n.t("End Date")}
              type="date"
              required
              dense
              value={endDate}
              onChange={({ value }) => setEndDate(value)}
            />
          </div>

          <div style={{ flex: '0 0 auto', position: 'relative' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              color: '#212934',
              marginBottom: '4px',
              fontWeight: 400,
            }}>
              {i18n.t('Organisation units')}
            </label>
            <button
              ref={anchorRef}
              onClick={() => setTreeOpen(!treeOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                minWidth: '200px',
                height: '34px',
                border: '1px solid #a0adba',
                borderRadius: '3px',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                color: selectedOrgUnits.size > 0 ? '#212934' : '#6e7a8a',
                textAlign: 'left',
              }}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {buttonLabel}
              </span>
              <span style={{ fontSize: '10px', color: '#6e7a8a' }}>{treeOpen ? '▲' : '▼'}</span>
            </button>

            {treeOpen && (
              <Layer onClick={() => setTreeOpen(false)} transparent>
                <Popper reference={anchorRef} placement="bottom-start">
                  <Card>
                    <div style={{
                      padding: '8px',
                      maxHeight: '300px',
                      overflow: 'auto',
                      minWidth: '280px',
                    }}>
                      <OrganisationUnitTree
                        roots={rootOrgUnitId}
                        selected={selectedPaths}
                        onChange={handleOrgUnitChange}
                        initiallyExpanded={[`/${rootOrgUnitId}`]}
                      />
                    </div>
                  </Card>
                </Popper>
              </Layer>
            )}
          </div>

          <div style={{ flex: '0 0 auto' }}>
            <Button primary onClick={handleFetchData}>
              {i18n.t('Fetch Data')}
            </Button>
          </div>
        </div>

        {selectedOrgUnits.size > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
            {[...selectedOrgUnits.entries()].map(([path, { displayName }]) => (
              <Chip key={path} onRemove={() => removeOrgUnit(path)}>
                {displayName}
              </Chip>
            ))}
          </div>
        )}
    </div>
  )
}