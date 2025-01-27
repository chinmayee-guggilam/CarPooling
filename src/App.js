import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import CreateRide from "./components/CreateRide";
import RidesList from "./components/RidesList";
import TimeLine from "./components/TimeLine";
import RideDetails from "./components/RideDetails";
import MyCreations from "./components/MyCreations";
import MyProfile from "./components/MyProfile";
import SearchRides from "./components/SearchRides";
import ChatPage from "./components/ChatPage";
import ChatList from "./components/ChatList";
import { AuthProvider } from "./components/AuthProvider";
import PrivateRoute from "./components/PrivateRoute";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route path="home" element={<RidesList />} />
            <Route path="create-ride" element={<CreateRide />} />
            <Route path="my-creations" element={<MyCreations />} />
            <Route path="time-line" element={<TimeLine/>}/>
            <Route path="rides-near-you" element={<SearchRides />} />
            <Route path="profile/:userId" element={<MyProfile />} />
            <Route path="ride-details/:rideId" element={<RideDetails />} />
            <Route path="chats" element={<ChatList />} />
            <Route path="chat/:chatId" element={<ChatPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
