import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
console.log("Base_URL",process.env);
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Loans', 'Friends'], // Add tagTypes
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (user) => ({
        url: '/auth/register',
        method: 'POST',
        body: user,
      }),
    }),
    getFriends: builder.query({
      query: () => '/friends',
      providesTags: ['Friends'], // Provide tags for getFriends query
    }),
    searchFriends: builder.query({
      query: (query) => `/friends/search?query=${query}`,
    }),
    addFriend: builder.mutation({
      query: (friendId) => ({
        url: '/friends',
        method: 'POST',
        body: { friend_id: friendId },
      }),
      invalidatesTags: ['Friends'], // Invalidate friends cache after addFriend mutation
    }),
    getTopScorers: builder.query({
      query: () => '/friends/top-scorers',
    }),
    getLoans: builder.query({
      query: (isBorrower) => `/loans?is_borrower=${isBorrower}`,
      providesTags: ['Loans'], // Provide tags for getLoans query
    }),
    requestLoan: builder.mutation({
      query: (loanRequest) => ({
        url: '/loans/request',
        method: 'POST',
        body: loanRequest,
      }),
      invalidatesTags: ['Loans'], // Invalidate loans cache after requestLoan mutation
    }),
    approveLoan: builder.mutation({
      query: (loanId) => ({
        url: '/loans/approve',
        method: 'POST',
        body: loanId,
      }),
      invalidatesTags: ['Loans'], // Invalidate loans cache after approveLoan mutation
    }),
    rejectLoan: builder.mutation({
      query: (loanId) => ({
        url: '/loans/reject',
        method: 'POST',
        body: loanId,
      }),
      invalidatesTags: ['Loans'], // Invalidate loans cache after rejectLoan mutation
    }),
    repayLoan: builder.mutation({
      query: (repayRequest) => ({
        url: '/loans/repay',
        method: 'POST',
        body: repayRequest,
      }),
      invalidatesTags: ['Loans'], // Invalidate loans cache after repayLoan mutation
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetFriendsQuery,
  useSearchFriendsQuery,
  useAddFriendMutation,
  useGetTopScorersQuery,
  useGetLoansQuery,
  useRequestLoanMutation,
  useApproveLoanMutation,
  useRejectLoanMutation,
  useRepayLoanMutation,
} = apiSlice;
