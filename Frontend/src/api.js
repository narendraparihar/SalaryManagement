export async function fetchWithAuth(url, options, navigate) {
  const response = await fetch(url, options);

  if (response.status === 401 || response.status === 403) {
    window.localStorage.removeItem('accessToken');
    navigate('/login', { replace: true });
  }

  return response;
}
