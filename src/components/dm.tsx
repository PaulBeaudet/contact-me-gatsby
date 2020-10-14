import React, { useState } from 'react';
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
          <label>Fullname</label>
          <input
            name="fullname"
            ref={register({ required: true, pattern: /^[a-zA-Z\s]*$/ })}
            placeholder="Fullname"
          />
          {errors.fullname && <p>Fullname is required</p>}
          <label>Email</label>
          <input
            name="contact"
            ref={register({
              required: true,
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'invalid email address',
              },
            })}
            placeholder="Email"
          />
          {errors.contact && <p>Valid email is required to respond </p>}
          <label>Message</label>
          <textarea
            name="message"
            ref={register({ required: true, minLength: 5, maxLength: 180 })}
            placeholder="Message to leave"
          />
          {errors.message && errors.message.type === 'required' && (
            <p>Forgot your message</p>
          )}
          {errors.message && errors.message.type === 'maxLength' && (
            <p>TL;DR, please keep it short and sweet</p>
          )}
          {errors.message && errors.message.type === 'minLength' && (
            <p>Its okay to send more than a hi</p>
          )}
          <br />
          <input type="submit" className="button" value="Send Message" />
        </form>
      )}
      {submitted && <p>Thanks for the message</p>}
    </>
  );
};

export default Dm;
