const bachSessionId = `
id {
    sessionId
    genNo
    acSession {
        sessionId
        genNo
    }
}
`;

export const getUnaggregatedAnswerSession = `
mutation GetUnAggregatedAnswerSession($session: BachSessionIdInput!, $columns: [UserPointSelectionInput!]!) {
    Answer__getUnaggregatedAnswer(session: $session, columns: $columns) {
        ${bachSessionId}
        answer {
            visualizations {
                ... on TableViz {
                    columns {
                        column {
                            id
                            name
                            referencedColumns {
                                guid
                                displayName
                            }
                        }
                    }
                }
            }
        }
    }
}  
`;

export const removeColumns = `
mutation RemoveColumns($session: BachSessionIdInput!, $logicalColumnIds: [GUID!], $columnIds: [GUID!]) {
    Answer__removeColumns(
        session: $session
        logicalColumnIds: $logicalColumnIds
        columnIds: $columnIds
        ) {
            ${bachSessionId}
    }
}
    `;

export const addColumns = `
    mutation AddColumns($session: BachSessionIdInput!, $columns: [AnswerColumnInfo!]!) {
        Answer__addColumn(session: $session, columns: $columns) {
            ${bachSessionId}
        }
    }
    `;

export const getAnswerData = `
    query GetTableWithHeadlineData($session: BachSessionIdInput!, $deadline: Int!, $dataPaginationParams: DataPaginationParamsInput!) {
        getAnswer(session: $session) {
            ${bachSessionId}
            answer {
                id
                visualizations {
                    id
                    ... on TableViz {
                        columns {
                            column {
                                id
                                name
                                type
                                aggregationType
                                dataType
                            }
                        }
                        data(deadline: $deadline, pagination: $dataPaginationParams)
                    }          
                }
            }
        }
    }
`;
