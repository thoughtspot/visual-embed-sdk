export function getDataForColumnName({ columns, data }, colName: string) {
    const column = columns
        .find(col => col.column.name.toLowerCase() === colName.toLowerCase())
        ?.column;

    if (!column) {
        throw new Error('Column name not present');
    }

    const columnData = data.columnDataLite.find(colData => colData.columnId === column.id);
    return columnData.dataValue;
}