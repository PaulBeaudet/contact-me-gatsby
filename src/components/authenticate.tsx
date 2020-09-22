import React, { useState, useEffect, useContext } from 'react';
import { GlobalUserContext } from '../context/GlobalState';
import { useForm } from 'react-hook-form';
import { loadStorage } from '../api/LocalStorage';

const Authenticate = () => {
  const [showAuth, setShowAuth] = useState(false);
  const { state, dispatch } = useContext(GlobalUserContext);
  const { register, handleSubmit, errors, reset } = useForm();

  const logInAction = data => {
    console.log(data);
    const { email, password } = data;
    dispatch({
      type: 'SIGN_IN',
      payload: {
        loggedIn: true,
        email,
      },
    });
    reset();
  };

  const logOutAction = data => {
    console.log(data);
    dispatch({
      type: 'LOG_OUT',
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
                type="email"
                name="email"
                ref={register({
                  required: true,
                  pattern: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
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
