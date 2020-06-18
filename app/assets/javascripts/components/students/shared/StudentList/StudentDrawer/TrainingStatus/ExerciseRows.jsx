import React from 'react';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash-es';
import dayjs from 'dayjs';

// Helper Components
const ExerciseStatusCell = ({ status }) => {
  return <td className={`exercise-status ${status}`}>{capitalize(status)}</td>;
};

// Helper Functions
const orderByDueDate = (a, b) => (dayjs(a.due_date).isBefore(dayjs(b.due_date)) ? -1 : 1);

const generateRow = status => (exercise) => {
  const dueDate = dayjs(exercise.due_date).format('MMM Do, YYYY');
  return (
    <tr className="student-training-module" key={exercise.id}>
      <td>{exercise.name} <small>Due by {dueDate}</small></td>
      <ExerciseStatusCell status={status} />
    </tr>
  );
};

export const ExerciseRows = ({ exercises }) => {
  const { unread, incomplete, complete } = exercises;
  return [
    unread.sort(orderByDueDate).map(generateRow('unread')),
    incomplete.sort(orderByDueDate).map(generateRow('incomplete')),
    complete.sort(orderByDueDate).map(generateRow('complete'))
  ];
};

const exerciseShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  due_date: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired
});
ExerciseRows.propTypes = {
  exercises: PropTypes.shape({
    unread: PropTypes.arrayOf(exerciseShape),
    incomplete: PropTypes.arrayOf(exerciseShape),
    complete: PropTypes.arrayOf(exerciseShape)
  }).isRequired
};

export default ExerciseRows;
