import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import 'react-native-url-polyfill/auto';

import { View } from 'react-native'
import { Session } from '@supabase/supabase-js'
import Account from './src/screen/Account'
import Auth from './src/screen/Login'
import { NavigationContainer } from '@react-navigation/native';
import MainNavigation from './src/navigations/MainNavigation';

export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase?.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <NavigationContainer>
      {session && session?.user ? <Account key={session.user.id} session={session} /> : <MainNavigation/>
    }
    </NavigationContainer>
  )
}