import React from 'react';
import Body from '../components/Body';

export default function Home({auth_token}) {
  console.log(auth_token);
  return (
    <div>
      <Body token={auth_token}/>
    </div>
  )
}
