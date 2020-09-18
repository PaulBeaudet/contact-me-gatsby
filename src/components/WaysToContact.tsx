import React, { useState, useEffect, useContext } from 'react';
import Dm from './dm';
import { useStaticQuery, graphql } from 'gatsby';
import { MetaQuery } from '../interface';
import firebase from 'firebase';
import { StyledFirebaseAuth } from 'react-firebaseui';
import { GlobalUserContext } from '../context/GlobalState';

const WaysToContact = () => {
  const [available, setAvailable] = useState(false);
  const [firebaseCreated, setFiredBaseCreated] = useState(false);
  const { state, dispatch } = useContext(GlobalUserContext);
  const { site }: MetaQuery = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          contact_api
          author
          firebaseConfig {
            apiKey
            authDomain
            databaseURL
            projectId
            storageBucket
            messagingSenderId
            appId
          }
        }
      }
    }
  `);
  const { contact_api, author, firebaseConfig } = site.siteMetadata;

  useEffect(() => {
    firebase.initializeApp(firebaseConfig);
    setFiredBaseCreated(true);
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        const { uid, displayName, photoURL, email } = user;
        dispatch({
          type: 'SIGN_IN',
          payload: {
            loggedIn: true,
            uid,
            displayName,
            photoURL,
            email,
          },
        });
      }
    });
  }, [dispatch]);

  const logOutAction = () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        dispatch({
          type: 'LOG_OUT',
        });
      });
  };

  const { loggedIn } = state;
  return (
    <div className="basic-grey">
      <h1>
        {` Contact - ${author}`}
        <span>
          {available
            ? 'Online: Leave a message or call'
            : 'Busy: Please leave a message'}
        </span>
      </h1>
      {firebaseCreated && !loggedIn && (
        <StyledFirebaseAuth
          uiConfig={{
            signInFlow: 'popup',
            signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
            callbacks: {
              signInSuccessWithAuthResult: () => false,
            },
          }}
          firebaseAuth={firebase.auth()}
        />
      )}
      <Dm contactApi={contact_api} />
      {firebaseCreated && loggedIn && (
        <button onClick={logOutAction} className="button">
          Sign-out
        </button>
      )}
    </div>
  );
};

export default WaysToContact;
