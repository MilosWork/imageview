import React from 'react';
import './App.css';
import Header from './components/Header';
import ImageCard from './components/ImageCard';
import cardImage from './image/3.jpg';

function App() {
  const cards = [
    { id: 1, imageUrl: cardImage, title: 'Card 1', buttonText: 'View More' },
    { id: 2, imageUrl: cardImage, title: 'Card 2', buttonText: 'View More' },
    { id: 3, imageUrl: cardImage, title: 'Card 3', buttonText: 'View More' },
    { id: 4, imageUrl: cardImage, title: 'Card 4', buttonText: 'View More' },
  ];

  return (
    <div className="App">
      <Header />
      <main className="app-body">
        <div className="cards-container">
          {cards.map((card) => (
            <ImageCard
              key={card.id}
              imageUrl={card.imageUrl}
              title={card.title}
              buttonText={card.buttonText}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
