import { useDataQuery, useAlert } from '@dhis2/app-runtime'
import { Button, CircularLoader, InputField, Table, TableBody, TableCell, TableCellHead, TableHead, TableRow, TableRowHead } from "@dhis2/ui";

import { AllRecordsHeaderView } from './AllRecordsHeaderView.jsx'
import React, { useState } from 'react'

import { PaginationControls } from './TumourComponents/PaginationControls.jsx'
import * as classes from '../App.module.css'
import i18n from "../locales/index.js";
import styles from './Form.module.css'

import { formatTodayDate } from "../app_utils/App_Utils";
import { useRootOrgUnitContext } from '../context/RootOrgUnitContext'
import { useMappingContext } from '../mapping/MappingContext'
import { eventsQuery } from '../queries/eventsQuery'

export const Tumour = () => {
    const { rootOrgUnitId, rootOrgUnitChildren: provinces } = useRootOrgUnitContext()
    const { mapping } = useMappingContext()
    const [forFileDownload, setForFileDownload] = useState(false)


    let RECS = "1", CHEC = "1", HIVSTATUS = "", DATEHIVTEST = "", AGE = "",ADDR= "",SECTOR= "",	CELL= "", VILLAGE="", MPCODE="", MPSEQ= "",MPTOT= "",INCID= "",BAS= "",TOP= "",BEH= "",
    LATERALITY="",MOR="",I10="",ICCC="",GRDE="",STAGE="",T="",N="",M="",UPDATE=formatTodayDate(),OBSOLETEFLAGTUMOURTABLE="0",TUMOURID= "",PATIENTIDTUMOURTABLE= "",PATIENTRECORDIDTUMOURTABLE="",TUMOURUPDATEDBY="",TUMOURUNDUPLICATIONSTATUS="",INITIALT="",INTENTT="",SGRY="",DATES="",CHEMO="",STARTC="",ENDCHEMO="",IMMUNO="",STARTI="",ENDIMMUNO="",HPVASS="",RADIO="",STARTR="",ENDRADIO="",HORMO="",STARTH="",ENDHORMO="",PALLIA="",DATEP="",OTHERT="",SPECIFYOT="",STARTOT="",ENDOT="";

    const tumourTableHeaders = "RECS"+"\t"+"CHEC"+"\t"+"HIVSTATUS"+"\t"+"DATEHIVTEST"+"\t"+"AGE"+"\t"+"ADDR"+"\t"+"SECTOR"+"\t"+"CELL"+"\t"+"VILLAGE"+"\t"+"MPCODE"+"\t"+"MPSEQ"+"\t"+"MPTOT"+"\t"+"INCID"+"\t"+"BAS"+"\t"+"TOP"+"\t"+"BEH"+"\t"+
            "LATERALITY"+"\t"+"MOR"+"\t"+"I10"+"\t"+"ICCC"+"\t"+"GRDE"+"\t"+"STAGE"+"\t"+"T"+"\t"+"N"+"\t"+"M"+"\t"+"UPDATE"+"\t"+"OBSOLETEFLAGTUMOURTABLE"+"\t"+"TUMOURID"+"\t"+"PATIENTIDTUMOURTABLE"+"\t"+"PATIENTRECORDIDTUMOURTABLE"+"\t"+"TUMOURUPDATEDBY"+"\t"+"TUMOURUNDUPLICATIONSTATUS"+"\t"+"INITIALT"+"\t"+"INTENTT"+"\t"+"SGRY"+"\t"+"DATES"+"\t"+"CHEMO"+"\t"+"STARTC"+"\t"+"ENDCHEMO"+"\t"+"IMMUNO"+"\t"+"STARTI"+"\t"+"ENDIMMUNO"+"\t"+"HPVASS"+"\t"+"RADIO"+"\t"+"STARTR"+"\t"+"ENDRADIO"+"\t"+"HORMO"+"\t"+"STARTH"+"\t"+"ENDHORMO"+"\t"+"PALLIA"+"\t"+"DATEP"+"\t"+"OTHERT"+"\t"+"SPECIFYOT"+"\t"+"STARTOT"+"\t"+"ENDOT";
    
    const formatPatientID = (oldID) => {
        var newID
        if (oldID.length == 9) { 
            newID = oldID.substring(0, 4) + oldID.substring(5);
        } else if  (oldID.length == 14) { 
            newID = oldID.substring(4, 8) + oldID.substring(10);
        }else {
            newID = oldID
        }
        return newID;
    }

    const formatCanRegDate = (dhis2DateFormat) => {
        let rawDate = dhis2DateFormat
        let pyear= rawDate.substring(0,4);
        let pmonth= rawDate.substring(5,7);
        let pdate= rawDate.substring(8,10);
        let canRegDateFormat = pyear+pmonth+pdate;
        return canRegDateFormat;
    }

    const exportTSVFile = (trackedEntityInstances) =>{        
        let tumourTableData = tumourTableHeaders;
        
        trackedEntityInstances.map((tei) => {
            let uniqueId = ''
            let aregnoOld = ''
            let tumourCounts = 0
            let tumourEvents = []
            tei.attributes.map((item) => {
                if (item.attribute == mapping.attributes.REGNO) {
                    uniqueId = item.value
                }
                if(item.attribute==mapping.attributes.REGNO_OLD) {
                    aregnoOld=item.value
                    }
            })
            
            // Getting the number of Tumour  stage events present in the current enrollment
            tei.enrollments.map((enrollment) => {
                enrollment.events.map((teiEvent) => {
                    if(teiEvent.programStage==mapping.programStages.tumour){
                        tumourCounts ++
                        tumourEvents.push(teiEvent)
                    } 
                })
            })
            
            for (let i = 0; i < tumourEvents.length; i++) {
                let teiEvent = tumourEvents[i]
                
                // Filling MPSEQ, MPTOT, TUMOURID, PATIENTIDTUMOURTABLE, and PATIENTRECORDIDTUMOURTABLE using patient unique ID
                MPSEQ = (i+1)

if(uniqueId=='')
{
    uniqueId=aregnoOld;   
}

                MPTOT = tumourEvents.length
                TUMOURID = uniqueId + '010'+ (i+1);
                PATIENTIDTUMOURTABLE = uniqueId;
                PATIENTRECORDIDTUMOURTABLE = uniqueId +'01';
                TOP ="";
     HIVSTATUS = "", DATEHIVTEST = "", AGE = "",ADDR= "",SECTOR= "",	CELL= "", VILLAGE="", MPCODE="", MPSEQ= "",MPTOT= "",INCID= "",BAS= "",TOP= "",BEH= "",
    LATERALITY="",MOR="",I10="",ICCC="",GRDE="",STAGE="",T="",N="",M="",TUMOURUPDATEDBY="",TUMOURUNDUPLICATIONSTATUS="",INITIALT="",INTENTT="",SGRY="",DATES="",CHEMO="",STARTC="",ENDCHEMO="",IMMUNO="",STARTI="",ENDIMMUNO="",HPVASS="",RADIO="",STARTR="",ENDRADIO="",HORMO="",STARTH="",ENDHORMO="",PALLIA="",DATEP="",OTHERT="",SPECIFYOT="",STARTOT="",ENDOT="";

                // Filling the rest of the tumor table fields
                teiEvent.dataValues.map((dataValue) =>{
                    if(dataValue.dataElement == mapping.dataElements.tumour.HIVSTATUS) { HIVSTATUS = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.DATEHIVTEST) { DATEHIVTEST = formatCanRegDate(dataValue.value) }
                    if(dataValue.dataElement == mapping.dataElements.tumour.AGE) { AGE = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.ADDR) { ADDR = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.SECTOR) { SECTOR = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.CELL) { CELL = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.VILLAGE) { VILLAGE = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.INCID) { INCID = formatCanRegDate(dataValue.value) }
                    if(dataValue.dataElement == mapping.dataElements.tumour.BAS) { BAS = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.TOP) { TOP = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.BEH) { BEH = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.LATERALITY) { LATERALITY = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.MOR) { MOR = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.GRDE) { GRDE = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.STAGE) {  dataValue.value == "Unkwown"? STAGE = "XX" : STAGE = dataValue.value  }
                    if(dataValue.dataElement == mapping.dataElements.tumour.T) { T = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.N) { N = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.M) { M = dataValue.value }
                    TUMOURUPDATEDBY = teiEvent.storedBy?teiEvent.storedBy:"";
                    if(dataValue.dataElement == mapping.dataElements.tumour.INITIALT) { INITIALT = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.INTENTT) { INTENTT = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.SGRY) { SGRY = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.DATES) { formatCanRegDate(DATES = dataValue.value) }
                    if(dataValue.dataElement == mapping.dataElements.tumour.CHEMO) { CHEMO = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.STARTC) { STARTC = formatCanRegDate(dataValue.value) }
                    if(dataValue.dataElement == mapping.dataElements.tumour.ENDCHEMO) { ENDCHEMO = formatCanRegDate(dataValue.value) }
                    if(dataValue.dataElement == mapping.dataElements.tumour.IMMUNO) { IMMUNO = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.STARTI) { STARTI = formatCanRegDate(dataValue.value) }
                    if(dataValue.dataElement == mapping.dataElements.tumour.ENDIMMUNO) { ENDIMMUNO = formatCanRegDate(dataValue.value) }
                    if(dataValue.dataElement == mapping.dataElements.tumour.RADIO) { RADIO = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.STARTR) { STARTR = formatCanRegDate(dataValue.value) }
                    if(dataValue.dataElement == mapping.dataElements.tumour.ENDRADIO) { ENDRADIO = formatCanRegDate(dataValue.value) }
                    if(dataValue.dataElement == mapping.dataElements.tumour.HORMO) { HORMO = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.STARTH) { STARTH = formatCanRegDate(dataValue.value) }
                    if(dataValue.dataElement == mapping.dataElements.tumour.ENDHORMO) { ENDHORMO = formatCanRegDate(dataValue.value) }
                    if(dataValue.dataElement == mapping.dataElements.tumour.PALLIA) { PALLIA = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.DATEP) { DATEP = formatCanRegDate(dataValue.value) }
                    if(dataValue.dataElement == mapping.dataElements.tumour.OTHERT) { OTHERT = dataValue.value }
                    if(dataValue.dataElement == mapping.dataElements.tumour.SPECIFYOT) { SPECIFYOT = dataValue.value }
                    
                });
                var tumourTableRow = RECS+"\t"+CHEC+"\t"+HIVSTATUS+"\t"+DATEHIVTEST+"\t"+AGE+"\t"+ADDR+"\t"+SECTOR+"\t"+CELL+"\t"+VILLAGE+"\t"+MPCODE+"\t"+MPSEQ+"\t"+MPTOT+"\t"+INCID+"\t"+BAS+"\t"+TOP+"\t"+BEH+"\t"+
                LATERALITY+"\t"+MOR+"\t"+I10+"\t"+ICCC+"\t"+GRDE+"\t"+STAGE+"\t"+T+"\t"+N+"\t"+M+"\t"+UPDATE+"\t"+OBSOLETEFLAGTUMOURTABLE+"\t"+TUMOURID+"\t"+PATIENTIDTUMOURTABLE+"\t"+PATIENTRECORDIDTUMOURTABLE+"\t"+
                TUMOURUPDATEDBY+"\t"+TUMOURUNDUPLICATIONSTATUS+"\t"+INITIALT+"\t"+INTENTT+"\t"+SGRY+"\t"+DATES+"\t"+CHEMO+"\t"+STARTC+"\t"+ENDCHEMO+"\t"+IMMUNO+"\t"+STARTI+"\t"+ENDIMMUNO+"\t"+HPVASS+"\t"+RADIO+"\t"+
                                STARTR+"\t"+ENDRADIO+"\t"+HORMO+"\t"+STARTH+"\t"+ENDHORMO+"\t"+PALLIA+"\t"+DATEP+"\t"+OTHERT+"\t"+SPECIFYOT+"\t"+STARTOT+"\t"+ENDOT;
                
                if ( (PATIENTIDTUMOURTABLE.length == 8) ) {
                    tumourTableData = tumourTableData+ "\n" +tumourTableRow;
                } 
            }
        });

        const aElement = document.createElement("a");
        const fileContents = new Blob([tumourTableData], {type: 'text/plain;charset=utf-8'});
        aElement.href = URL.createObjectURL(fileContents);
        aElement.download = "tumour_data.txt";
        document.body.appendChild(aElement); // Required for this to work in FireFox
        aElement.click();

        // Reset file dowload to false
        setForFileDownload(false)

        // Show paginated list again
        refetch({ 
            pageSize: 5
        })
    }
    
    // A dynamic alert to communicate success or failure 
    const { show } = useAlert(
        ({ message }) => message,
        ({ status }) => {
            if (status === 'success') return { success: true }
            else if (status === 'error') return { critical: true }
            else return {}
        } )

    const { loading, error, data, refetch } = useDataQuery(eventsQuery, {
        variables: { page: 1, startDate: '2018-01-01', endDate: '2021-07-18', orgUnitID: rootOrgUnitId, pageSize: 5, ouMode: 'SELECTED', program: mapping.program },
    })

    if (error) { return <span>ERROR: {error.message}</span> }

    if (loading) {
        return (
            <>
                {/* <AllRecordsHeaderView provinces={provinces}/> */}
                <CircularLoader />
            </>
        )
    }

    if (data.results.trackedEntities) {  
        if (forFileDownload) {
            exportTSVFile(data.results.trackedEntities)
        }
    }

    const updateDowloadInfo = (pageSize) =>{
        setForFileDownload(true)

        refetch({ 
            pageSize: pageSize
        })
    }

    // Refetches and updates the tumour data as long as the Filter button is clicked
    const updateFetchInfo = (startDate, endDate, orgUnitID, ouMode) => {
        refetch({ 
            startDate: startDate,
            endDate: endDate,
            orgUnitID: orgUnitID,
            ouMode: ouMode
        })
        setForFileDownload(false)
    }

    return (

        <div className={classes.tableContainer}>
          <div className='products'>
            <AllRecordsHeaderView onUpdateFetchInfo={updateFetchInfo} provinces={provinces}/>
            <Table>
                <TableHead>
                    <TableRowHead>
                        <TableCellHead className={styles.leftcell}>
                            <div className={styles.row}>
                                <div className={styles.downloadfiles}>
                                    <Button primary onClick={() => updateDowloadInfo( data.results.pager.total)}>{i18n.t('Download Tumour Data')} </Button>
                                </div>
                            </div>
                        </TableCellHead>
                    </TableRowHead>
                </TableHead>
            </Table>
            <Table>
            <TableHead>
                <TableRowHead>
                <TableCellHead>AGE</TableCellHead>
                <TableCellHead>ADDR</TableCellHead>
                <TableCellHead>MPTOT</TableCellHead>
                <TableCellHead>INCID</TableCellHead> 
                <TableCellHead>BAS</TableCellHead>
                <TableCellHead>TOP</TableCellHead>
                <TableCellHead>BEH</TableCellHead>
                <TableCellHead>PATIENTIDTUMOURTABLE</TableCellHead>
                <TableCellHead>TUMOURIDSOURCETABLE</TableCellHead>
                </TableRowHead>
            </TableHead>
            <TableBody>
                {data.results.trackedEntities.map((tei) => (
                tei.enrollments.map((enrollment) => (
                    enrollment.events.map((teiEvent) => (
                    teiEvent.programStage==mapping.programStages.tumour?
                    <TableRow key={teiEvent.event}> 
                        <TableCell>{teiEvent.dataValues.map(dataValue => dataValue.dataElement==mapping.dataElements.tumour.AGE?dataValue.value:"")}</TableCell>
                        <TableCell>{teiEvent.dataValues.map(dataValue => dataValue.dataElement==mapping.dataElements.tumour.ADDR?dataValue.value:"")}</TableCell>
                        <TableCell>{teiEvent.dataValues.map(dataValue => dataValue.dataElement==mapping.dataElements.tumour.MPTOT?dataValue.value:"")}</TableCell>
                        <TableCell>{teiEvent.dataValues.map(dataValue => dataValue.dataElement==mapping.dataElements.tumour.INCID? formatCanRegDate(dataValue.value):"")}</TableCell>
                        <TableCell>{teiEvent.dataValues.map(dataValue => dataValue.dataElement==mapping.dataElements.tumour.BAS?dataValue.value:"")}</TableCell>
                        <TableCell>{teiEvent.dataValues.map(dataValue => dataValue.dataElement==mapping.dataElements.tumour.TOP?dataValue.value:"")}</TableCell>
                        <TableCell>{teiEvent.dataValues.map(dataValue => dataValue.dataElement==mapping.dataElements.tumour.LATERALITY?dataValue.value:"")}</TableCell>
                        <TableCell>{teiEvent.dataValues.map(dataValue => dataValue.dataElement==mapping.dataElements.tumour.PATIENTIDTUMOURTABLE?formatPatientID(dataValue.value):"")}</TableCell>
                        <TableCell>{teiEvent.dataValues.map(dataValue => dataValue.dataElement==mapping.dataElements.tumour.PATIENTIDTUMOURTABLE?formatPatientID(dataValue.value) + '01':"")}</TableCell>
                        </TableRow>
                        : 
                        <TableRow key={teiEvent.event}></TableRow>
                    ))
                ))
                ))
                }
                </TableBody>
            </Table>
        </div>
            <PaginationControls pager={data.results.pager} refetch={refetch} />
        </div>
    )
}
