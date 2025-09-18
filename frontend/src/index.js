import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './style.css';
import App from './App';
import React from 'react';
import {Amplify} from 'aws-amplify';
import awsExports from './aws-exports';
Amplify.configure(awsExports);


// Import HOC and optional default styles
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

const AppWithAuth = withAuthenticator(App);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppWithAuth />);