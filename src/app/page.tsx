import Head from "next/head";
import Header from "../components/Header";
import { NextPage } from "next";
//import Link from "next/link";

const Home: NextPage = () => {
  return (
    <div>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to Concursus!</h1>
      </main>
    </div>
  );
};

export default Home;