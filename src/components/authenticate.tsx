import React, { useState, useEffect, useContext } from 'react';
import { GlobalUserContext } from '../context/GlobalState';
import { useForm } from 'react-hook-form';
import { wsSend, wsOn } from '../api/WebSocket';

const Authenticate = () => {
  const [showAuth, setShowAuth] = useState(false);
  const { state, dispatch } = useContext(GlobalUserContext);
  const { register, handleSubmit, errors, reset } = useForm();
  const { loggedIn, sessionOid, lastSession, clientOid } = state;

  useEffect(() => {
    wsOn('login', () => {
      dispatch({
        type: 'SIGN_IN',
        payload: {
          loggedIn: true,
          host: true,
          hostAvail: true,
        },
      });
    });
    wsOn('reject', () => {
      dispatch({
        type: 'REJECT',
        payload: {
          host: false,
          loggedIn: false,
          lastSession: '',
        },
      });
    });
    wsOn('fail', console.log);
  }, []);

  const logInAction = data => {
    const { email, password } = data;
    wsSend('login', {
      email,
      password,
      thisSession: sessionOid,
      lastSession,
      clientOid,
    });
    dispatch({
      type: 'HOST_ATTEMPT',
      payload: {
        host: true,
        email,
      },
    });
    reset();
  };

  const logOutAction = () => {
    wsSend('logout');
    dispatch({
      type: 'LOG_OUT',
      payload: {
        host: false,
        hostAvail: false,
        loggedIn: false,
        lastSession: '',
      },
    });
    reset();
  };

  const formAction = loggedIn ? logOutAction : logInAction;
  const formType: string = loggedIn ? 'Log-out' : 'Sign-in';
  // shows either sign in our log out options
  return (
    <>
      <button
        onClick={() => {
          setShowAuth(!showAuth);
        }}
      >
        {`Authentication options${showAuth ? ' -^' : ' -v'}`}
      </button>
      <br />
      <form onSubmit={handleSubmit(formAction)}>
        {!loggedIn && showAuth && (
          <>
            <label>Email</label>
            <input
              name="email"
              ref={register({
                required: true,
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'invalid email address',
                },
              })}
              placeholder="email"
            />
            {errors.email && <span>required</span>}
            <label>Password</label>
            <input
              type="password"
              name="password"
              ref={register({
                required: true,
              })}
              placeholder="password"
            />
            {errors.password && <span>required</span>}
          </>
        )}
        {showAuth && (
          <>
            <br />
            <input type="submit" className="button" value={formType} />
          </>
        )}
      </form>
    </>
  );
};

export default Authenticate;
