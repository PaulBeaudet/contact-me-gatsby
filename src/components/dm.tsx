import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { GlobalUserContext } from '../context/GlobalState';

interface props {
  contactApi: string;
}

const Dm: React.FC<props> = ({ contactApi }) => {
  const [submitted, setSubmitted] = useState<boolean>(false);
  const { state, dispatch } = useContext(GlobalUserContext);
  const { register, handleSubmit, errors, reset } = useForm();

  const { email, displayName, loggedIn } = state;
  const onSubmit = data => {
    const { fullname, contact, message } = data;
    const msg = `${fullname} (${contact}): ${message}`;
    console.log(`sending: ${msg}`);
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: msg,
      }),
    };
    fetch(contactApi, requestOptions).then(res => {
      if (res.status === 200) {
        console.log('thanks for the message'); // maybe actually display this
        reset();
        setSubmitted(true);
      }
    });
  };

  return (
    <>
      {!submitted && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <label>
            <span>Full name :</span>
            <input
              name="fullname"
              ref={register({ required: true, pattern: /^[a-zA-Z\s]*$/ })}
              value={displayName}
              placeholder="Actual Name"
              readOnly={loggedIn}
              onChange={event => {
                dispatch({
                  type: 'CHANGE_TARGET',
                  payload: { displayName: event.target.value },
                });
              }}
            />
          </label>
          {errors.fullname && (
            <span>Fullname people would know you by is required</span>
          )}
          <label>
            <span>Email: </span>
            <input
              name="contact"
              ref={register({
                required: true,
                pattern: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
              })}
              value={email}
              placeholder="Where to respond"
              readOnly={loggedIn}
              onChange={event => {
                dispatch({
                  type: 'CHANGE_TARGET',
                  payload: { email: event.target.value },
                });
              }}
            />
          </label>
          {errors.contact && <span>Valid email is required to respond </span>}
          <label>
            <span>Message: </span>
            <textarea
              name="message"
              ref={register({ required: true, minLength: 5, maxLength: 180 })}
              placeholder="There is a character limit, we can talk more once we connect"
            />
          </label>
          {errors.message && errors.message.type === 'required' && (
            <span>A message would be helpful</span>
          )}
          {errors.message && errors.message.type === 'maxLength' && (
            <span>Too many characters, please keep it short and sweet</span>
          )}
          {errors.message && errors.message.type === 'minLength' && (
            <span>Its okay to send more than a hi</span>
          )}
          <label>
            <input type="submit" className="button" value="Send Message" />
          </label>
          <br />
        </form>
      )}
      {submitted && <p>Thanks for the message</p>}
    </>
  );
};

export default Dm;
