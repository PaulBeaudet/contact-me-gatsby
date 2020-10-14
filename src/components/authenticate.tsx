import React, { useEffect, useContext } from 'react';
import { GlobalUserContext } from '../context/GlobalState';
import { useForm } from 'react-hook-form';
import { wsSend, wsOn } from '../api/WebSocket';

const Authenticate = () => {
  const { state, dispatch } = useContext(GlobalUserContext);
  const { register, handleSubmit, errors, reset } = useForm();
  const { loggedIn, sessionOid, lastSession, clientOid, email } = state;

  useEffect(() => {
    wsOn('login', () => {
      dispatch({
        type: 'SIGN_IN',
        payload: {
          loggedIn: true,
          host: true,
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
    if (loggedIn) {
      wsSend('login', {
        clientOid,
        lastSession,
        thisSession: sessionOid,
        email,
      });
      dispatch({
        type: 'HOST_ATTEMPT',
        payload: {
          host: true,
        },
      });
    }
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

  // shows either sign in our log out options
  if(loggedIn){
    return (
      <form onSubmit={handleSubmit(logOutAction)}>
        <br />
        <button type="submit" className="button">Log-out</button>
      </form>
    )
  }
  return (
    <form onSubmit={handleSubmit(logInAction)}>
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
      <br />
      <button type="submit" className="button">Sign-in</button>
    </form>
  );
};

export default Authenticate;
