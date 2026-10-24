# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Employee directory on the overview

The overview loads employees from `GET /api/v1/employees` using the backend's Spring page response. It sorts newest employees first and includes page/size controls. The employee total comes from the response's `totalElements`.

The employee directory searches by name through `GET /api/v1/employees/search?keyword=...`. Search requests are debounced by 350 ms and return to the first page.

The overview's **Latest exchange rates** panel loads the latest rates from Frankfurter's public API. Select AUD, CAD, EUR, GBP, INR, SGD, or USD as the base currency; the panel displays rates only for those seven currencies.

The Analytics page loads workforce overview, salary-by-country, salary-by-department, salary distribution, and highest-paid employee data from `/api/v1/analytics/overview`, `/api/v1/analytics/salaries/by-country`, `/api/v1/analytics/salaries/by-department`, `/api/v1/analytics/salaries/distribution`, and `/api/v1/analytics/highest-paid`. Salary distribution requires a currency code; country, department, and as-of date filters are optional. The highest-paid employee grid has its own optional country filter, sent as the `countryCode` query parameter. Filter options are populated from the salary-by-country and salary-by-department responses. The Questions grid submits a question and `as_of_date` to `POST /api/v1/questions` and displays the answer.

Use **Add employee** on the employee directory to submit employee details with `POST /api/v1/employees`. The request uses the signed-in bearer token.

Select an employee to edit their details with `PUT /api/v1/employees/{id}`. The edit form also provides **Delete employee**, which asks for confirmation before sending `DELETE /api/v1/employees/{id}`.

Use the edit button on a salary row to update its amount, currency, or effective dates with `PATCH /api/v1/salaries/{id}`.

Use `#/signup` to create an account and `#/login` to sign in. Successful sign-in stores the backend's `accessToken` in `localStorage` and navigates to `#/dashboard`. Protected API requests use it as a bearer token; a `401` or `403` response clears the token and redirects to sign-in.

Set `REACT_APP_API_BASE_URL` in the frontend environment to the backend origin when it is not `http://localhost:8080`. The backend's `APP_CORS_ALLOWED_ORIGINS` setting accepts a comma-separated list of frontend origins and defaults to `http://localhost:3000`.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
