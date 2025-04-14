if (typeof (Promise as any).withResolvers === 'undefined') {
    (Promise as any).withResolvers = () => {
        let resolve;
        let reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}
