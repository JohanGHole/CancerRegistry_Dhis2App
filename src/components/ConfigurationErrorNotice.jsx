import React from 'react'
import { NoticeBox } from '@dhis2/ui'
import i18n from '../locales/index.js'

export const ConfigurationErrorNotice = ({ error }) => {
    const httpStatus = error?.details?.httpStatusCode
    const isConfigError = httpStatus === 400 || httpStatus === 404 || httpStatus === 409

    if (isConfigError) {
        return (
            <NoticeBox
                error
                title={i18n.t('Configuration error')}
            >
                <p>
                    {i18n.t(
                        'The app could not load data from the server. This usually means the mapping configuration does not match the tracker program on this DHIS2 instance.'
                    )}
                </p>
                <p>
                    <strong>
                        {i18n.t(
                            'Have you configured the mapping table in the Data Store (cancerRegistryApp → fieldMapping)?'
                        )}
                    </strong>
                </p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                    {i18n.t('Server response')}: {error.message}
                </p>
            </NoticeBox>
        )
    }

    return (
        <NoticeBox error title={i18n.t('Error')}>
            {error.message}
        </NoticeBox>
    )
}
