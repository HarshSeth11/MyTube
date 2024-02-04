const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
};



/*

This is just the another way of doing the same thing.

const asynceHandler = (fn) => async (req, res, next) => {
    try{
        await fn(req, res, next);
    }catch(err) {
        next(err)
    }
}

*/

export {asyncHandler};