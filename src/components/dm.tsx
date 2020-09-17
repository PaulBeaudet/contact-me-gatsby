import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useStaticQuery, graphql } from 'gatsby';
import { MetaQuery } from '../interface';

const Dm = () => {
  let [submitted, setSubmitted] = useState<boolean>(false);
  const { register, handleSubmit, errors, reset } = useForm();
  const { site }: MetaQuery = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          contact_api
          contact_redirect
          author
        }
      }
    }
  `);
  const { contact_api, contact_redirect, author } = site.siteMetadata;
  const onSubmit = data => {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: data.fullname + ' (' + data.contact + '): ' + data.message,
      }),
    };
    fetch(contact_api, requestOptions).then(res => {
      if (res.status === 200) {
        console.log('thanks for the message');
        reset();
        setSubmitted(true);
        setTimeout(() => {
          window.location = contact_redirect;
        }, 7000);
      }
    });
  };

  return (
    <>
      {!submitted && (
        <form className="basic-grey" onSubmit={handleSubmit(onSubmit)}>
          <h1>
            {` Contact ${author}`}
            <span>Maybe we can connect</span>
          </h1>
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
          <br />
        </form>
      )}
      {submitted && <p>Thanks for the message</p>}
    </>
  );
};

export default Dm;
