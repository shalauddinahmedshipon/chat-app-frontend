// import { useEffect, useState } from "react";
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import useUserStore from "./store/userStore";
// import Login from "./pages/Login";
// import Providers from "./pages/Providers";
// import Chat from "./pages/Chat";

// function App() {
//   const initializeUser = useUserStore((state) => state.initializeUser);
//   const user = useUserStore((state) => state.user);
//   const [loading, setLoading] = useState(true); // ⬅️ track initialization

//   useEffect(() => {
//     initializeUser();
//     setLoading(false); // done initializing
//   }, []);

//   if (loading) return <p className="text-center mt-10">Loading...</p>; // ⬅️ show loading while checking token

//   return (
//     <Router>
//      <Routes>
//   <Route path="/login" element={<Login />} />

//   {/* User-only route */}
//   <Route
//     path="/providers"
//     element={
//       user && user.role === "USER" ? (
//         <Providers />
//       ) : user ? (
//         <Navigate to="/chat" />
//       ) : (
//         <Navigate to="/login" />
//       )
//     }
//   />

//   {/* Chat route (both USER and PROVIDER) */}
//   <Route
//     path="/chat"
//     element={
//       user ? (
//         <Chat />
//       ) : (
//         <Navigate to="/login" />
//       )
//     }
//   />

//   {/* Optional: redirect unknown paths */}
//   <Route path="*" element={<Navigate to={user ? (user.role === "USER" ? "/providers" : "/chat") : "/login"} />} />
// </Routes>

//     </Router>
//   );
// }

// export default App;

import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import useUserStore from "./store/userStore";
import Login from "./pages/Login";
import Providers from "./pages/Providers";
import Chat from "./pages/Chat";

function App() {
  const initializeUser = useUserStore((state) => state.initializeUser);
  const user = useUserStore((state) => state.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeUser();
    setLoading(false); // ✅ move AFTER initialization
  }, []);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* User-only route */}
        <Route
          path="/providers"
          element={
            user && user.role === "USER" ? (
              <Providers />
            ) : user ? (
              <Navigate to="/chat" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Chat route (both USER and PROVIDER) */}
        <Route
          path="/chat"
          element={user ? <Chat /> : <Navigate to="/login" />}
        />

        {/* Fallback */}
        <Route
          path="*"
          element={
            <Navigate
              to={user ? (user.role === "USER" ? "/providers" : "/chat") : "/login"}
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
