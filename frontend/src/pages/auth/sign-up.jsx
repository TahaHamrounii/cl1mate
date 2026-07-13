import { CONFIG } from 'src/global-config';

import { SignUpView } from 'src/sections/auth/sign-up-view';

// ----------------------------------------------------------------------

const metadata = { title: `Sign up | Layout centered - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title> {metadata.title}</title>

      <SignUpView />
    </>
  );
}
