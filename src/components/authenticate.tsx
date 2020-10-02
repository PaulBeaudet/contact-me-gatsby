import React, { useState, useEffect, useContext } from 'react';
import { GlobalUserContext } from '../context/GlobalState';
import { useForm } from 'react-hook-form';
import { wsSend, wsOn } from '../api/WebSocket';
import { loadStorage, noStorage } from '../api/LocalStorage';

const Authenticate = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [lStorage, setLStorage] = useState(noStorage);
  const { state, dispatch } = useContext(GlobalUserContext);
  const { register, handleSubmit, errors, reset } = useForm();

  const isHosting = (toggle: boolean) => {
    return {
      type: toggle ? 'HOST_ATTEMPT' : 'HOST_FAIL',
      payload: {
        host: toggle,
      },
    };
  };

  useEffect(() => {
    setLStorage(loadStorage());
    wsOn('login', payload => {
      const { email } = payload;
      if (email) {
        lStorage.write({ ...payload });
        dispatch({
          type: 'SIGN_IN',
          payload: {
            loggedIn: true,
            ...payload,
          },
        });
      } else {
        dispatch(isHosting(false));
        console.log('Oops something when wrong');
      }
    });
    wsOn('reject', payload => {
      console.dir(payload);
      dispatch(isHosting(false));
    });
    wsOn('fail', console.log);
  }, []);

  const logInAction = data => {
    const { email, password } = data;
    wsSend('login', {
      email,
      password,
      oid: lStorage.read('oid'),
    });
    dispatch(isHosting(true));
    reset();
  };

  const logOutAction = data => {
    console.log(data);
    dispatch({
      type: 'LOG_OUT',
      payload: {
        host: false,
        hostAvail: false,
      },
    });
    reset();
  };

  const { loggedIn } = state;
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
            <label>
              <span>Email: </span>
              <input
                // type="email"
                name="email"
                ref={register({
                  required: true,
                  // pattern: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                })}
                placeholder="email"
              />
            </label>
            {errors.email && <span>required</span>}
            <label>
              <span>Password: </span>
              <input
                type="password"
                name="password"
                ref={register({
                  required: true,
                })}
                placeholder="password"
              />
            </label>
            {errors.password && <span>required</span>}
          </>
        )}
        {showAuth && (
          <label>
            <input type="submit" className="button" value={formType} />
          </label>
        )}
      </form>
    </>
  );
};

export default Authenticate;
