import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { wsSend } from '../api/WebSocket';

const Dm: React.FC = () => {
  const [submitted, setSubmitted] = useState<boolean>(false);
  const { register, handleSubmit, errors, reset } = useForm();

  const onSubmit = data => {
    const { fullname, contact, message } = data;
    const msg = `${fullname} (${contact}): ${message}`;
    wsSend('relay', { msg });
    reset();
    setSubmitted(true);
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
              placeholder="Actual Name"
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
              placeholder="Where to respond"
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
        </form>
      )}
      {submitted && <p>Thanks for the message</p>}
    </>
  );
};

export default Dm;
