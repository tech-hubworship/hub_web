import Head from 'next/head';

export default function Custom500() {
  return (
    <>
      <Head>
        <title>500 - Server Error</title>
      </Head>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1>500</h1>
        <p>서버 오류가 발생했습니다.</p>
      </div>
    </>
  );
}
