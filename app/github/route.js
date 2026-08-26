export function GET(request) {
  return Response.redirect(new URL("/docs", request.url), 307);
}
