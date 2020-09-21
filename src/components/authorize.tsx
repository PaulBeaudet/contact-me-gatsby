import React, { useState, useEffect, useContext } from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import { MetaQuery } from '../interface';
import firebase from 'firebase';
import { StyledFirebaseAuth } from 'react-firebaseui';
import { GlobalUserContext } from '../context/GlobalState';

const Authorize = () => {
  const [firebaseCreated, setFiredBaseCreated] = useState(false);
  const { state, dispatch } = useContext(GlobalUserContext);
  const { site }: MetaQuery = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
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
  const { firebaseConfig } = site.siteMetadata;

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
  // shows either sign in our log out options
  return (
    <>
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
      {firebaseCreated && loggedIn && (
        <button onClick={logOutAction} className="button">
          Sign-out
        </button>
      )}
    </>
  );
};

export default Authorize;
