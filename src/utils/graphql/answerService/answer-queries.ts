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

export const addFilter = `
    mutation AddUpdateFilter($session: BachSessionIdInput!, $params: AddUpdateFilterInput!) {
        Answer__addUpdateFilter(session: $session, params: $params) {
            ${bachSessionId}
        }
    }
`;

export const getAnswer = `
    query GetAnswer($session: BachSessionIdInput!) {
        getAnswer(session: $session) {
            ${bachSessionId}
            answer {
                id
                name
                description
                displayMode
                sources {
                    header {
                        guid
                        displayName
                    }
                }
                filterGroups {
                    columnInfo {
                        name
                        referencedColumns {
                            guid
                            displayName
                        }
                    }
                    filters {
                        filterContent {
                            filterType
                            negate
                            value {
                                key
                            }
                        }
                    }
                }
                metadata {
                    author
                    authorId
                    createdAt
                    isDiscoverable
                    isHidden
                    modifiedAt
                }
                visualizations {
                    ... on TableViz {
                        id
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
                    ... on ChartViz {
                        id
                    }
                }
            }
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

export const addVizToLiveboard = `
    mutation AddVizToLiveboard(liveboardId: GUID!, session: BachSessionIdInput!, tabId: GUID, vizId: GUID!) {
        Answer__addVizToPinboard(
            pinboardId: liveboardId

            session: $session

            tabId: $tabId

            vizId: $vizId
        ) {
            ${bachSessionId}
        }
    }
`;

export const getSQLQuery = `
    mutation GetSQLQuery($session: BachSessionIdInput!) {
        Answer__getQuery(session: $session) {
            sql
        }
    }
`;

export const updateDisplayMode = `
   mutation UpdateDisplayMode(
    $session: BachSessionIdInput!
    $displayMode: DisplayMode
) {
    Answer__updateProperties(session: $session, displayMode: $displayMode) {
        id {
            sessionId
            genNo
            acSession {
                sessionId
                genNo
            }
        }
        answer {
            id
            displayMode
            suggestedDisplayMode
        }
    }
}
`;

export const getAnswerTML = `
mutation GetUnsavedAnswerTML($session: BachSessionIdInput!, $exportDependencies: Boolean, $formatType:  EDocFormatType, $exportPermissions: Boolean, $exportFqn: Boolean) {
  UnsavedAnswer_getTML(
    session: $session
    exportDependencies: $exportDependencies
    formatType: $formatType
    exportPermissions: $exportPermissions
    exportFqn: $exportFqn
  ) {
    zipFile
    object {
      edoc
      name
      type
      __typename
    }
    __typename
  }
}`;
