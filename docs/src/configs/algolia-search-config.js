const algoliaIndexMap = {
    PROD : 'Pages',
    MAIN : 'main',
    LOCAL : 'dev',
}

const getAlgoliaIndex = () => {
    const BUILD_ENV = process.env.BUILD_ENV;
    return algoliaIndexMap[BUILD_ENV] || algoliaIndexMap.LOCAL;
}

module.exports = {
    getAlgoliaIndex
}
