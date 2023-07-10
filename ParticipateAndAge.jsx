import { Fragment } from 'react';
import census from '../fixtures/census.json';

const ParticipationAndAge = () => {
  const participationRate = (
    (census.participantCount / census.totalResidents) *
    100
  ).toFixed(2);

  const locationAndAveAge = census.locations.map((location) => {
    const validAge = location.responses.filter(
      (resp) =>
        Number(resp.age) > 0 && Number(resp.age) <= 120 && !isNaN(resp.age)
    );

    const totalAge = validAge.reduce((acc, cur) => acc + +cur.age, 0);

    const aveAge = (totalAge / validAge.length).toFixed(2);

    return (
      <div
        style={{ display: 'flex', justifyContent: 'space-between' }}
        key={location.id}
      >
        <div>{location.name}</div>
        <div>{isNaN(aveAge) ? 'No Response' : aveAge}</div>
      </div>
    );
  });

  return (
    <Fragment>
      <div style={{ color: 'white', backgroundColor: 'blue' }}>
        Participation Rate : {participationRate} %
      </div>
      {locationAndAveAge}
    </Fragment>
  );
};

export default ParticipationAndAge;
