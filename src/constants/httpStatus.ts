const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    UNPROCESSABLE_ENTITY: 422,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
    UNFOBBIDEN : 403
  } as const 
//   xem như hằng số
  export default HTTP_STATUS;