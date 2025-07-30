# pim-mvp

This repository contains a very small PIM (Product Information Management) MVP.

## Frontend

The frontend is built with React and Vite. To run it locally you need a `.env` file inside `frontend-pim` with the API URL:

```
VITE_API_URL=http://localhost:4000
```

After installing dependencies run `npm run dev` inside `frontend-pim`.

## Backend

The backend is an Express API located in `backend-pim`.

Run the tests with:

```
npm --prefix backend-pim test
```
